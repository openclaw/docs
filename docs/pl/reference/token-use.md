---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub zachowania kompaktowania
summary: Jak OpenClaw buduje kontekst promptu oraz raportuje użycie tokenów i koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-04-05T14:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny są specyficzne dla modelu, ale większość
modeli w stylu OpenAI ma średnio ~4 znaki na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie przez `read`)
- Instrukcje samodzielnej aktualizacji
- Pliki workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy są nowe, oraz `MEMORY.md`, gdy istnieje, lub `memory.md` jako fallback pisany małymi literami). Duże pliki są przycinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 20000), a całkowity limit wstrzykiwania bootstrap jest ograniczony przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 150000). Pliki `memory/*.md` są ładowane na żądanie przez narzędzia pamięci i nie są wstrzykiwane automatycznie.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie heartbeat
- Metadane runtime (host/OS/model/thinking)

Pełny podział znajdziesz w [System Prompt](/pl/concepts/system-prompt).

## Co liczy się do okna kontekstu

Wszystko, co model otrzymuje, liczy się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania kompaktowania i artefakty przycinania
- Wrappery dostawców lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

W przypadku obrazów OpenClaw zmniejsza rozmiar payloadów obrazów transkryptu/narzędzi przed wywołaniami dostawców.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów vision i rozmiar payloadu.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla OCR/zrzutów ekranu z interfejsem użytkownika.

Aby uzyskać praktyczny podział (na każdy wstrzyknięty plik, narzędzia, Skills i rozmiar promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Context](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń w czacie:

- `/status` → **bogata w emoji karta statusu** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi oraz **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrzymuje się per sesja (zapisywane jako `responseUsage`).
  - OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów na podstawie logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawców (`X% left`, a nie koszty per odpowiedź).
  Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe aliasy pól natywnych dostawców przed wyświetleniem.
Dla ruchu Responses z rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, dzięki czemu nazwy pól
specyficzne dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie Gemini CLI JSON również jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` jest mapowane na `cacheRead`, przy czym używane jest `stats.input_tokens - stats.cached`,
gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu Responses z rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
brakuje `total_tokens` lub ma wartość `0`.
Gdy bieżący snapshot sesji jest ubogi, `/status` i `session_status` mogą
również odzyskiwać liczniki tokenów/cache oraz etykietę aktywnego modelu runtime z
najnowszego logu użycia transkryptu. Istniejące niezerowe wartości live nadal mają
pierwszeństwo przed wartościami fallback z transkryptu, a większe sumy transkryptu
zorientowane na prompt mogą wygrywać, gdy zapisane sumy są nieobecne lub mniejsze.
Auth użycia dla okien limitów dostawców pochodzi z hooków specyficznych dla dostawców, jeśli są
dostępne; w przeciwnym razie OpenClaw wraca do dopasowania poświadczeń OAuth/API key
z profili auth, env lub konfiguracji.

## Szacowanie kosztów (gdy jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to wartości **USD za 1M tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje informacji o cenie, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

## Wpływ TTL cache i przycinania

Cache promptów dostawcy ma zastosowanie tylko w oknie TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL cache,
a następnie resetuje okno cache, aby kolejne żądania mogły ponownie użyć
świeżo zcache'owanego kontekstu zamiast ponownie cache'ować pełną historię. Pozwala to
utrzymać niższe koszty zapisu do cache, gdy sesja pozostaje bezczynna po upływie TTL.

Skonfiguruj to w [Gateway configuration](/pl/gateway/configuration), a szczegóły
zachowania znajdziesz w [Session pruning](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** podczas przerw bezczynności. Jeśli TTL cache modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może
zapobiec ponownemu cache'owaniu pełnego promptu, zmniejszając koszty zapisu do cache.

W konfiguracjach wieloagentowych możesz utrzymywać jedną współdzieloną konfigurację modelu i dostrajać zachowanie cache
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajdziesz w [Prompt Caching](/reference/prompt-caching).

W przypadku cen Anthropic API odczyty z cache są znacznie tańsze niż tokeny wejściowe,
podczas gdy zapisy do cache są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL znajdziesz w cenniku prompt caching Anthropic:
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
        every: "55m" # utrzymuj długi cache ciepły dla głębokich sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unikaj zapisów do cache dla skokowych powiadomień
```

`agents.list[].params` scala się na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i dziedziczyć pozostałe domyślne wartości modelu bez zmian.

### Przykład: włączenie nagłówka beta Anthropic 1M context

Okno kontekstu 1M Anthropic jest obecnie ograniczone bramką beta. OpenClaw może wstrzyknąć
wymaganą wartość `anthropic-beta`, gdy włączysz `context1m` dla obsługiwanych modeli Opus
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

Ma to zastosowanie tylko wtedy, gdy dla tego wpisu modelu ustawiono `context1m: true`.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu (rozliczanie kluczem API
lub ścieżka logowania Claude w OpenClaw z włączonym Extra Usage). W przeciwnym razie
Anthropic odpowiada
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Jeśli uwierzytelniasz Anthropic tokenami OAuth/subscription (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca to połączenie z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/tools/skills).
