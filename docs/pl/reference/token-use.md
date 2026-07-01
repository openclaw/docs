---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub zachowania Compaction
summary: Jak OpenClaw buduje kontekst promptu oraz raportuje użycie tokenów i koszty
title: Wykorzystanie tokenów i koszty
x-i18n:
    generated_at: "2026-07-01T20:39:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw śledzi **tokeny**, nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI ma średnio ~4 znaki na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie za pomocą `read`).
  Natywne tury Codex otrzymują zwarty blok Skills jako instrukcje deweloperskie
  współpracy o zakresie tury; inne harnessy otrzymują go w normalnej
  powierzchni promptu. Jest ograniczony przez `skills.limits.maxSkillsPromptChars`, z
  opcjonalnym nadpisaniem dla agenta w `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Workspace + pliki bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy nowe, plus `MEMORY.md` gdy obecny). Natywne tury Codex nie wklejają surowego `MEMORY.md` ze skonfigurowanego workspace agenta, gdy narzędzia pamięci są dostępne dla tego workspace; zawierają mały wskaźnik pamięci w instrukcjach deweloperskich współpracy o zakresie tury i używają narzędzi pamięci na żądanie. Jeśli narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne albo aktywny workspace różni się od workspace pamięci agenta, `MEMORY.md` używa normalnej, ograniczonej ścieżki kontekstu tury. Mały root `memory.md` nie jest wstrzykiwany; jest starszym wejściem naprawczym dla `openclaw doctor --fix`, gdy występuje w parze z `MEMORY.md`. Duże wstrzykiwane pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 20000), a całkowite wstrzyknięcie bootstrapu jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią normalnego promptu bootstrapu; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale uruchomienia modelu reset/startup mogą dodać na początku jednorazowy blok kontekstu startowego z ostatnią dzienną pamięcią dla tej pierwszej tury. Surowe polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu. Wstęp startowy jest kontrolowany przez `agents.defaults.startupContext`. Fragmenty AGENTS.md po Compaction są osobne i wymagają jawnego włączenia `agents.defaults.compaction.postCompactionSections`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane runtime (host/OS/model/thinking)

Pełny podział znajdziesz w [Prompcie systemowym](/pl/concepts/system-prompt).

Dokumentując poświadczenia lub fragmenty autoryzacji, używaj
[Konwencji placeholderów sekretów](/pl/reference/secret-placeholder-conventions), aby
uniknąć fałszywych trafień skanera sekretów w zmianach dotyczących wyłącznie dokumentacji.

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia konwersacji (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Wrappery dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używane przez runtime mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla agenta znajdują się pod `agents.list[].contextLimits`. Te ustawienia są
przeznaczone dla ograniczonych fragmentów runtime i wstrzykiwanych bloków należących do runtime. Są
oddzielne od limitów bootstrapu, limitów kontekstu startowego i limitów promptu Skills.

`toolResultMaxChars` to zaawansowany limit górny (do `1000000` znaków). Gdy nie jest ustawiony, OpenClaw wybiera
aktywny limit wyników narzędzi z efektywnego okna kontekstu modelu: `16000` znaków
poniżej 100 tys. tokenów, `32000` znaków przy 100 tys.+ tokenów i `64000` znaków przy 200 tys.+
tokenów, nadal ograniczone przez zabezpieczenie udziału kontekstu runtime.

Dla obrazów OpenClaw zmniejsza payloady obrazów transkrypcji/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów wizyjnych i rozmiar payloadu.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu obciążonych OCR/UI.

Aby uzyskać praktyczny podział (według wstrzykniętego pliku, narzędzi, Skills i rozmiaru promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak zobaczyć bieżące użycie tokenów

Użyj tego w czacie:

- `/status` → **karta statusu z emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi oraz **szacowanym kosztem**, gdy lokalne ceny są
  skonfigurowane dla aktywnego modelu.
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrwala się dla sesji (przechowywane jako `responseUsage`).
  - `/usage reset` (aliasy: `inherit`, `clear`, `default`) — czyści nadpisanie sesji,
    aby sesja ponownie odziedziczyła skonfigurowaną wartość domyślną.
  - `/usage tokens` pokazuje szczegóły tokenów/cache tury.
  - `/usage full` pokazuje zwarte szczegóły modelu/kontekstu/kosztu; szacowany koszt pojawia się
    tylko wtedy, gdy OpenClaw ma metadane użycia i lokalne ceny dla aktywnego modelu.
    Niestandardowe układy `messages.usageTemplate` mogą zawierać pola tokenów/cache.
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, nie koszty dla każdej odpowiedzi).
  Bieżący dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawcy przed wyświetleniem.
Dla ruchu Responses rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól specyficzne dla transportu
nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie Gemini CLI też jest normalizowane: domyślny parser `stream-json` odczytuje
zdarzenia `message` asystenta, a `stats.cached` mapuje się na `cacheRead` z
`stats.input_tokens - stats.cached` użytym, gdy CLI pomija jawne pole
`stats.input`. Starsze nadpisania JSON nadal odczytują tekst odpowiedzi z
`response`.
Dla natywnego ruchu Responses rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
`total_tokens` brakuje albo wynosi `0`.
Gdy bieżący snapshot sesji jest ubogi, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/cache oraz aktywną etykietę modelu runtime z
najnowszego logu użycia transkrypcji. Istniejące niezerowe wartości live nadal mają
pierwszeństwo przed wartościami fallback z transkrypcji, a większe, zorientowane na prompt
sumy transkrypcji mogą wygrać, gdy zapisanych sum brakuje albo są mniejsze.
Autoryzacja użycia dla okien limitów dostawcy pochodzi z hooków specyficznych dla dostawcy, gdy
są dostępne; w przeciwnym razie OpenClaw wraca do dopasowania poświadczeń OAuth/API-key
z profili auth, env albo config.
Wpisy transkrypcji asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca
zwraca metadane użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcji
stabilne źródło nawet po zniknięciu stanu runtime live.

OpenClaw utrzymuje rozliczanie użycia dostawcy oddzielnie od bieżącego snapshotu kontekstu.
`usage.total` dostawcy może obejmować buforowane wejście, wyjście i wiele
wywołań modelu w pętli narzędzi, więc jest przydatne dla kosztów i telemetrii, ale może zawyżać
okno kontekstu live. Wyświetlanie kontekstu i diagnostyka używają najnowszego snapshotu promptu
(`promptTokens` albo ostatniego wywołania modelu, gdy snapshot promptu nie jest
dostępny) dla `context.used`.

## Szacowanie kosztów (gdy pokazywane)

Koszty są szacowane z konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, `/usage full` pomija koszt; użyj `/usage tokens`
albo niestandardowego `messages.usageTemplate`, gdy potrzebujesz szczegółów tokenów/cache w każdej
odpowiedzi. Wyświetlanie kosztów nie jest ograniczone do autoryzacji API-key: dostawcy inni niż API-key,
tacy jak `aws-sdk`, mogą pokazywać szacowany koszt, gdy ich skonfigurowany wpis modelu zawiera
lokalne ceny, a dostawca zwraca metadane użycia.

Po tym, jak sidecary i kanały osiągną ścieżkę gotowości Gateway, OpenClaw uruchamia
opcjonalny bootstrap cen w tle dla skonfigurowanych referencji modeli, które nie mają
jeszcze lokalnych cen. Ten bootstrap pobiera zdalne katalogi cen OpenRouter i LiteLLM.
Ustaw `models.pricing.enabled: false`, aby pominąć te pobrania katalogów
w sieciach offline lub z ograniczeniami; jawne wpisy
`models.providers.*.models[].cost` nadal napędzają lokalne szacunki kosztów.

## TTL cache i wpływ przycinania

Buforowanie promptów przez dostawcę działa tylko w oknie TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL
cache, a następnie resetuje okno cache, aby kolejne żądania mogły ponownie używać
świeżo zbuforowanego kontekstu zamiast ponownie buforować całą historię. Utrzymuje to niższe
koszty zapisu cache, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [Konfiguracji Gateway](/pl/gateway/configuration) i zobacz
szczegóły zachowania w [Przycinaniu sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymać cache **ciepły** przez przerwy bezczynności. Jeśli TTL cache modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może uniknąć
ponownego buforowania pełnego promptu, zmniejszając koszty zapisu cache.

W konfiguracjach z wieloma agentami możesz utrzymać jedną współdzieloną konfigurację modelu i dostrajać zachowanie cache
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajdziesz w [Buforowaniu promptów](/pl/reference/prompt-caching).

W przypadku cen API Anthropic odczyty cache są znacznie tańsze niż tokeny wejściowe,
podczas gdy zapisy cache są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL znajdziesz w cenach
buforowania promptów Anthropic:
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

### Kontekst Anthropic 1M

OpenClaw rozmiaruje modele Claude 4.x zdolne do GA, takie jak Opus 4.8, Opus 4.7, Opus 4.6 i
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

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic odpowiada błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic tokenami OAuth/subskrypcji (`sk-ant-oat-*`),
OpenClaw zachowuje wymagane przez OAuth nagłówki beta Anthropic, jednocześnie usuwając
wycofany nagłówek beta `context-1m-*`, jeśli pozostaje w starszej konfiguracji.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Opisy Skills powinny być krótkie (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Zobacz [Skills](/pl/tools/skills), aby poznać dokładny wzór narzutu listy Skills.

## Powiązane

- [Użycie i koszty API](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
