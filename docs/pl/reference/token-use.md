---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub działania Compaction
summary: Jak OpenClaw buduje kontekst promptu oraz raportuje użycie tokenów i koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-04-21T10:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI średnio zużywa około 4 znaków na token dla tekstu angielskiego.

## Jak budowany jest system prompt

OpenClaw składa własny system prompt przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie przez `read`).
  Zwarty blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem per agent w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Workspace + pliki bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, gdy są nowe, oraz `MEMORY.md`, gdy istnieje, lub `memory.md` jako fallback pisany małymi literami). Duże pliki są przycinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a całkowite wstrzykiwanie bootstrap jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią zwykłego promptu bootstrap; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale czyste `/new` i `/reset` mogą poprzedzić pierwszą turę jednorazowym blokiem kontekstu startowego z ostatnią dzienną pamięcią. To preludium startowe jest kontrolowane przez `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Reply Tags + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/thinking)

Pełny rozkład znajdziesz w [System Prompt](/pl/concepts/system-prompt).

## Co liczy się do okna kontekstu

Wszystko, co model otrzymuje, liczy się do limitu kontekstu:

- System prompt (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Wrappery dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używane przez środowisko uruchomieniowe mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania per agent znajdują się w `agents.list[].contextLimits`. Te ustawienia
dotyczą ograniczonych fragmentów środowiska uruchomieniowego i wstrzykiwanych bloków należących do środowiska uruchomieniowego. Są one
oddzielne od limitów bootstrap, limitów kontekstu startowego i limitów promptu Skills.

Dla obrazów OpenClaw zmniejsza rozmiar ładunków obrazów z transkryptu/narzędzi przed wywołaniami dostawcy.
Do strojenia użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`):

- Niższe wartości zwykle zmniejszają użycie tokenów vision i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z OCR/interfejsem.

Praktyczny rozkład (per wstrzyknięty plik, narzędzia, Skills i rozmiar system prompt) uzyskasz przez `/context list` lub `/context detail`. Zobacz [Context](/pl/concepts/context).

## Jak zobaczyć bieżące użycie tokenów

Użyj tych poleceń na czacie:

- `/status` → **karta statusu bogata w emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi i **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dołącza **stopkę użycia per odpowiedź** do każdej odpowiedzi.
  - Utrwala się per sesja (zapisywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** obsługiwane są `/status` i `/usage`.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, a nie koszty per odpowiedź).
  Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawcy przed wyświetleniem.
Dla ruchu Responses rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, tak aby nazwy pól specyficzne dla transportu
nie zmieniały `/status`, `/usage` ani podsumowań sesji.
Użycie JSON Gemini CLI jest również normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` mapuje się na `cacheRead`, przy czym `stats.input_tokens - stats.cached`
jest używane, gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu Responses rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a wartości łączne wracają do znormalizowanych wejścia + wyjścia, gdy
brakuje `total_tokens` lub wynosi `0`.
Gdy bieżąca migawka sesji jest uboga, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/cache i etykietę aktywnego modelu środowiska uruchomieniowego z
ostatniego logu użycia transkryptu. Istniejące niezerowe aktywne wartości nadal mają
pierwszeństwo przed wartościami odzyskanymi z transkryptu, a większe sumy zorientowane na prompt
z transkryptu mogą wygrywać, gdy zapisane sumy są brakujące lub mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawcy pochodzi z hooków specyficznych dla dostawcy, gdy
są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/API key
z profili uwierzytelniania, env lub konfiguracji.
Wpisy transkryptu asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca
zwraca metadane użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcie
stabilne źródło nawet po zniknięciu aktywnego stanu środowiska uruchomieniowego.

## Szacowanie kosztów (gdy jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen Twojego modelu:

```
models.providers.<provider>.models[].cost
```

Są to wartości **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brak danych o cenach, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

## Wpływ Cache TTL i przycinania

Cache promptów dostawcy działa tylko w obrębie okna Cache TTL. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu Cache TTL,
a następnie resetuje okno cache, aby kolejne żądania mogły ponownie użyć
świeżo zbuforowanego kontekstu zamiast ponownie cache’ować całą historię. Utrzymuje to niższe
koszty zapisu do cache, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [konfiguracji Gateway](/pl/gateway/configuration), a szczegóły
zachowania znajdziesz w [Session pruning](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** między okresami bezczynności. Jeśli Cache TTL
Twojego modelu wynosi `1h`, ustawienie interwału Heartbeat tuż poniżej tej wartości (np. `55m`) może
pozwolić uniknąć ponownego cache’owania pełnego promptu, zmniejszając koszty zapisu do cache.

W konfiguracjach wieloagentowych możesz utrzymywać jedną współdzieloną konfigurację modelu i stroić zachowanie cache
per agent za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).

Dla cen Anthropic API odczyty cache są znacząco tańsze niż tokeny wejściowe,
podczas gdy zapisy cache są rozliczane z wyższym mnożnikiem. Aktualne stawki i mnożniki TTL znajdziesz w cenach prompt caching Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymywanie 1h cache w stanie warm za pomocą Heartbeat

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

### Przykład: ruch mieszany ze strategią cache per agent

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
        every: "55m" # utrzymuj długi cache w stanie warm dla głębokich sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unikaj zapisów cache dla skokowych powiadomień
```

`agents.list[].params` scala się na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe ustawienia domyślne modelu bez zmian.

### Przykład: włącz nagłówek beta Anthropic 1M context

Okno kontekstu Anthropic 1M jest obecnie objęte bramkowaniem beta. OpenClaw może wstrzyknąć wymaganą
wartość `anthropic-beta`, gdy włączysz `context1m` dla obsługiwanych modeli Opus
lub Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Mapuje się to na nagłówek beta Anthropic `context-1m-2025-08-07`.

Ma to zastosowanie tylko wtedy, gdy `context1m: true` jest ustawione dla tego wpisu modelu.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic odpowiada błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic za pomocą tokenów OAuth/subskrypcyjnych (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca to połączenie z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).
