---
read_when:
    - Objaśnienie wykorzystania tokenów, kosztów i okien kontekstu
    - Debugowanie wzrostu kontekstu lub działania Compaction
summary: Jak OpenClaw tworzy kontekst promptu oraz raportuje użycie tokenów i koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-07-12T15:39:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny zależą od modelu, ale większość
modeli w stylu OpenAI używa średnio około 4 znaków na token w tekście angielskim.

## Jak tworzony jest monit systemowy

OpenClaw składa własny monit systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi i krótkie opisy
- Listę Skills (tylko metadane; instrukcje są wczytywane na żądanie za pomocą `read`). Natywne
  tury Codex otrzymują zwarty blok Skills jako ograniczone do danej tury instrukcje deweloperskie
  dotyczące współpracy; inne środowiska wykonawcze otrzymują go w standardowej części monitu.
  Rozmiar jest ograniczony przez `skills.limits.maxSkillsPromptChars`, z opcjonalnym nadpisaniem
  dla poszczególnych agentów w `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Pliki przestrzeni roboczej i pliki startowe (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` w przypadku nowej przestrzeni oraz
  `MEMORY.md`, jeśli istnieje). Duże wstrzykiwane pliki są skracane zgodnie z
  `agents.defaults.bootstrapMaxChars` (domyślnie: `20000`); łączny rozmiar wstrzykiwanych
  danych startowych jest ograniczony przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie:
  `60000`).
  - Natywne tury Codex nie wklejają nieprzetworzonego pliku `MEMORY.md`, gdy dla danej
    przestrzeni roboczej dostępne są narzędzia pamięci; zamiast tego otrzymują niewielkie
    odwołanie do pamięci w ograniczonych do danej tury instrukcjach deweloperskich dotyczących
    współpracy i korzystają z narzędzi pamięci na żądanie. Jeśli narzędzia są wyłączone,
    wyszukiwanie w pamięci jest niedostępne lub aktywna przestrzeń robocza różni się od
    przestrzeni pamięci agenta, `MEMORY.md` wraca do standardowej, ograniczonej ścieżki
    kontekstu tury.
  - Plik `memory.md` zapisany małymi literami w katalogu głównym nigdy nie jest wstrzykiwany.
    Stanowi starsze dane wejściowe do naprawy przez `openclaw doctor --fix`, który migruje
    go do `MEMORY.md`.
  - Dzienne pliki `memory/*.md` nie są częścią standardowego monitu startowego;
    podczas zwykłych tur pozostają dostępne na żądanie za pośrednictwem narzędzi pamięci.
    Uruchomienia modelu po resecie lub przy starcie mogą dodać na początku jednorazowy blok
    kontekstu startowego z ostatnią pamięcią dzienną dla tej pierwszej tury, kontrolowany przez
    `agents.defaults.startupContext`. Polecenia `/new` i `/reset` w zwykłym czacie są
    potwierdzane bez wywoływania modelu.
  - Fragmenty `AGENTS.md` po Compaction są odrębne i wymagają jawnego włączenia przez
    `agents.defaults.compaction.postCompactionSections`.
- Czas (UTC i strefę czasową użytkownika)
- Znaczniki odpowiedzi i zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/system operacyjny/model/tryb rozumowania)

Pełne zestawienie znajduje się w sekcji [Monit systemowy](/pl/concepts/system-prompt).

Podczas dokumentowania danych uwierzytelniających lub fragmentów konfiguracji uwierzytelniania
stosuj [Konwencje symboli zastępczych dla sekretów](/pl/reference/secret-placeholder-conventions),
aby uniknąć fałszywie dodatnich wyników skanera sekretów w zmianach dotyczących wyłącznie dokumentacji.

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Monit systemowy (wszystkie powyższe sekcje)
- Historia rozmowy (wiadomości użytkownika i asystenta)
- Wywołania narzędzi i ich wyniki
- Załączniki/transkrypcje (obrazy, dźwięk, pliki)
- Podsumowania Compaction i artefakty przycinania
- Warstwy pośrednie dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal wliczane)

Powierzchnie intensywnie korzystające ze środowiska uruchomieniowego mają własne jawne limity w
`agents.defaults.contextLimits` (nadpisania dla poszczególnych agentów w
`agents.list[].contextLimits`):

| Klucz                    | Przeznaczenie                                                            |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | Maksymalna liczba znaków zwracanych przez `memory_get` przed skróceniem. |
| `memoryGetDefaultLines`  | Domyślne okno wierszy `memory_get`, gdy żądanie pomija `lines`.          |
| `toolResultMaxChars`     | Zaawansowany limit pojedynczego bieżącego wyniku narzędzia (do `1000000` znaków). |
| `postCompactionMaxChars` | Maksymalna liczba znaków zachowywanych z `AGENTS.md` podczas odświeżania po Compaction. |

Są to ograniczone fragmenty środowiska uruchomieniowego i wstrzykiwane bloki należące do tego
środowiska, odrębne od limitów danych startowych, limitów kontekstu startowego i limitów monitu Skills.

`toolResultMaxChars` jest domyślnie nieustawione, dlatego OpenClaw wyznacza limit bieżącego
wyniku narzędzia na podstawie efektywnego okna kontekstu modelu: `16000` znaków poniżej
100 tys. tokenów, `32000` znaków przy co najmniej 100 tys. tokenów i `64000` znaków przy co
najmniej 200 tys. tokenów. Ograniczenie udziału w kontekście środowiska uruchomieniowego nadal
ogranicza pojedynczy wynik narzędzia do 30% okna kontekstu, nawet jeśli skonfigurowano większy
jawny limit.

W przypadku obrazów OpenClaw zmniejsza rozdzielczość danych obrazów z transkrypcji i narzędzi
przed wywołaniami dostawcy. Ustawienie można dostosować za pomocą
`agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`):

- Niższe wartości zmniejszają zużycie tokenów wizyjnych i rozmiar danych.
- Wyższe wartości zachowują więcej szczegółów wizualnych w zrzutach ekranu wymagających OCR lub zawierających rozbudowany interfejs użytkownika.

Aby uzyskać praktyczne zestawienie rozmiarów poszczególnych wstrzykiwanych plików, narzędzi,
Skills i monitu systemowego, użyj `/context list` lub `/context detail`. Zobacz
[Kontekst](/pl/concepts/context).

## Jak sprawdzić bieżące zużycie tokenów

Na czacie:

- `/status` -> rozbudowana karta stanu z emoji, zawierająca model sesji, wykorzystanie kontekstu,
  tokeny wejściowe/wyjściowe ostatniej odpowiedzi oraz szacowany koszt, gdy dla aktywnego modelu
  skonfigurowano lokalne ceny.
- `/usage off|tokens|full` -> dołącza stopkę zużycia dla każdej odpowiedzi.
  Ustawienie jest zachowywane dla sesji (jako `responseUsage`).
  - `/usage reset` (aliasy: `inherit`, `clear`, `default`) usuwa nadpisanie sesji, dzięki czemu
    ponownie dziedziczy ona skonfigurowaną wartość domyślną.
  - `/usage tokens` pokazuje szczegóły tokenów i pamięci podręcznej dla tury.
  - `/usage full` pokazuje zwięzłe szczegóły modelu, kontekstu i kosztu; szacowany koszt
    pojawia się tylko wtedy, gdy OpenClaw ma metadane zużycia i lokalne ceny aktywnego modelu.
    Niestandardowe układy `messages.usageTemplate` mogą zawierać pola tokenów i pamięci podręcznej.
- `/usage cost` -> lokalne podsumowanie kosztów z dzienników sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** obsługiwane są `/status` i `/usage`.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, a nie koszty poszczególnych odpowiedzi).
  Dostawcy obecnie obsługujący okna zużycia: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan i z.ai.

Przed wyświetleniem powierzchnie zużycia normalizują typowe aliasy natywnych pól dostawców.
W przypadku ruchu Responses z rodziny OpenAI obejmuje to zarówno
`input_tokens`/`output_tokens`, jak i `prompt_tokens`/`completion_tokens`, dzięki czemu
nazwy pól specyficzne dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Zużycie Gemini CLI również jest normalizowane: domyślny parser `stream-json` odczytuje zdarzenia
`message` asystenta, a `stats.cached` jest mapowane na `cacheRead`; gdy CLI pomija jawne pole
`stats.input`, używana jest wartość `stats.input_tokens - stats.cached`. Starsze nadpisania JSON
nadal odczytują tekst odpowiedzi z `response`.

W przypadku natywnego ruchu Responses z rodziny OpenAI aliasy zużycia WebSocket/SSE są
normalizowane w ten sam sposób, a gdy brakuje `total_tokens` lub ma ono wartość `0`, suma jest
wyznaczana na podstawie znormalizowanych danych wejściowych i wyjściowych.

Gdy bieżąca migawka sesji zawiera niewiele danych, `/status` i `session_status` mogą odzyskać
liczniki tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska uruchomieniowego
z najnowszego dziennika zużycia transkrypcji. Istniejące niezerowe wartości bieżące nadal mają
pierwszeństwo przed wartościami awaryjnie pobranymi z transkrypcji, a większe sumy transkrypcji
zorientowane na monit mogą zostać użyte, gdy zapisanych sum brakuje lub są mniejsze.

Uwierzytelnianie zużycia dla okien limitów dostawców pochodzi najpierw z mechanizmów właściwych
dla danego dostawcy; jeśli dostawca nie ma takiego mechanizmu albo mechanizm nie rozpozna tokenu,
OpenClaw awaryjnie dopasowuje dane uwierzytelniające OAuth/klucza API z profili uwierzytelniania,
zmiennych środowiskowych lub konfiguracji.

Wpisy asystenta w transkrypcji zachowują ten sam znormalizowany kształt danych o zużyciu,
w tym `usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca zwraca metadane zużycia.
Zapewnia to `/usage cost` i stan sesji oparty na transkrypcji ze stabilnym źródłem danych nawet
po zniknięciu bieżącego stanu środowiska uruchomieniowego.

OpenClaw przechowuje rozliczanie zużycia dostawcy oddzielnie od bieżącej migawki kontekstu.
Wartość `usage.total` dostawcy może obejmować dane wejściowe z pamięci podręcznej, dane wyjściowe
oraz wiele wywołań modelu w pętli narzędzi, dlatego jest przydatna do obliczania kosztów
i telemetrii, ale może zawyżać bieżące wykorzystanie okna kontekstu. Widoki i diagnostyka
kontekstu używają najnowszej migawki monitu (`promptTokens` albo ostatniego wywołania modelu,
gdy migawka monitu jest niedostępna) jako `context.used`.

## Szacowanie kosztów (gdy jest wyświetlane)

Koszty są szacowane na podstawie konfiguracji cen modeli:

```text
models.providers.<provider>.models[].cost
```

Są to kwoty w **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, `/usage full` pomija koszt; użyj
`/usage tokens` albo niestandardowego `messages.usageTemplate`, gdy w każdej odpowiedzi
potrzebujesz szczegółów tokenów i pamięci podręcznej. Wyświetlanie kosztów nie ogranicza się
do uwierzytelniania kluczem API: dostawcy bez klucza API, tacy jak `aws-sdk`, mogą pokazywać
szacowany koszt, gdy skonfigurowany wpis modelu zawiera lokalne ceny, a dostawca zwraca
metadane zużycia.

Gdy procesy pomocnicze i kanały osiągną stan gotowości Gateway, OpenClaw rozpoczyna opcjonalne
wczytywanie cen w tle dla skonfigurowanych odwołań do modeli, które nie mają jeszcze lokalnych
cen. Proces ten pobiera zdalne katalogi cen OpenRouter i LiteLLM. Ustaw
`models.pricing.enabled: false`, aby pominąć pobieranie tych katalogów w sieciach offline lub
z ograniczeniami; jawne wpisy `models.providers.*.models[].cost` nadal sterują lokalnymi
szacunkami kosztów.

## Wpływ czasu TTL pamięci podręcznej i przycinania

Buforowanie monitów przez dostawcę działa tylko w oknie czasu TTL pamięci podręcznej. OpenClaw
może opcjonalnie wykonywać **przycinanie według TTL pamięci podręcznej**: po wygaśnięciu TTL
pamięci podręcznej przycina sesję, a następnie resetuje okno pamięci podręcznej, aby kolejne
żądania ponownie używały świeżo zbuforowanego kontekstu zamiast ponownie buforować całą historię.
Pozwala to obniżyć koszty zapisu do pamięci podręcznej, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj tę funkcję w sekcji [Konfiguracja Gateway](/pl/gateway/configuration), a szczegóły jej
działania znajdziesz w sekcji [Przycinanie sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymywać pamięć podręczną **aktywną** podczas okresów bezczynności. Jeśli TTL
pamięci podręcznej modelu wynosi `1h`, ustawienie interwału Heartbeat nieco poniżej tej wartości
(np. `55m`) może zapobiec ponownemu buforowaniu całego monitu, zmniejszając koszty zapisu do
pamięci podręcznej.

W konfiguracjach wieloagentowych można zachować jedną współdzieloną konfigurację modelu
i dostosować zachowanie pamięci podręcznej dla każdego agenta za pomocą
`agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajduje się w sekcji
[Buforowanie monitów](/pl/reference/prompt-caching).

W przypadku cen API Anthropic odczyty z pamięci podręcznej są znacznie tańsze od tokenów
wejściowych, natomiast zapisy do pamięci podręcznej są rozliczane z wyższym mnożnikiem.
Najnowsze stawki i mnożniki TTL znajdziesz w cenniku buforowania monitów Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymywanie aktywnej 1-godzinnej pamięci podręcznej za pomocą Heartbeat

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

### Przykład: ruch mieszany ze strategią pamięci podręcznej dla poszczególnych agentów

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # domyślna wartość bazowa dla większości agentów
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # utrzymuj aktywną długoterminową pamięć podręczną dla rozbudowanych sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unikaj zapisów do pamięci podręcznej dla seryjnych powiadomień
```

`agents.list[].params` jest scalane z `params` wybranego modelu, dzięki czemu można nadpisać
wyłącznie `cacheRetention`, zachowując bez zmian pozostałe wartości domyślne modelu.

### Kontekst Anthropic 1M

OpenClaw przydziela okno kontekstu Anthropic o rozmiarze 1M modelom Claude 4.x obsługującym
ogólną dostępność, takim jak Opus 4.8, Opus 4.7, Opus 4.6 i Sonnet 4.6. Dla tych modeli nie trzeba
ustawiać `params.context1m: true`.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Starsze konfiguracje mogą zachować `context1m: true`, ale OpenClaw nie wysyła już dla tego
ustawienia wycofanego nagłówka beta Anthropic `context-1m-2025-08-07` ani nie rozszerza
nieobsługiwanych starszych modeli Claude do 1M.

Wymaganie: dane uwierzytelniające muszą umożliwiać korzystanie z długiego kontekstu. W przeciwnym razie
Anthropic odpowiada błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz się w Anthropic za pomocą tokenów OAuth/subskrypcji
(`sk-ant-oat-*`), OpenClaw zachowuje wymagane przez OAuth nagłówki beta
Anthropic, usuwając jednocześnie wycofany nagłówek beta `context-1m-*`, jeśli nadal występuje on
w starszej konfiguracji.

## Wskazówki dotyczące zmniejszania zużycia tokenów

- Używaj `/compact`, aby podsumowywać długie sesje.
- Ograniczaj duże dane wyjściowe narzędzi w swoich przepływach pracy.
- Zmniejsz wartość `agents.defaults.imageMaxDimensionPx` w sesjach zawierających wiele zrzutów ekranu.
- Opisy Skills powinny być krótkie (lista Skills jest wstawiana do promptu).
- W przypadku rozwlekłej pracy eksploracyjnej preferuj mniejsze modele.

Dokładny wzór narzutu listy Skills znajdziesz w sekcji [Skills](/pl/tools/skills).

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
