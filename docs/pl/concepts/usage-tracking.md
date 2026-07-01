---
read_when:
    - Konfigurujesz powierzchnie użycia/limitów dostawcy
    - Musisz wyjaśnić zachowanie śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Powierzchnie śledzenia użycia i wymagania dotyczące poświadczeń
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-07-01T20:37:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Czym to jest

- Pobiera użycie/limity dostawcy bezpośrednio z jego endpointów użycia.
- Bez szacowanych kosztów; tylko okna limitów lub podsumowania stanu konta
  raportowane przez dostawcę.
- Czytelne dla człowieka wyjście stanu okna limitu jest normalizowane do
  `X% left`, nawet gdy nadrzędne API raportuje zużyty limit, pozostały limit
  albo tylko surowe liczby. Dostawcy bez resetowalnych okien limitów mogą
  zamiast tego pokazywać tekst podsumowania dostawcy, na przykład saldo.
- `/status` na poziomie sesji i `session_status` mogą wrócić do najnowszego
  wpisu użycia z transkrypcji, gdy bieżący snapshot sesji jest skąpy. Ten
  mechanizm uzupełnia brakujące liczniki tokenów/pamięci podręcznej, może
  odzyskać etykietę aktywnego modelu środowiska uruchomieniowego i preferuje
  większą sumę zorientowaną na prompt, gdy metadanych sesji brakuje albo są
  mniejsze. Istniejące niezerowe wartości bieżące nadal mają pierwszeństwo.

## Gdzie się pojawia

- `/status` w czatach: karta stanu bogata w emoji z tokenami sesji + szacowanym kosztem (tylko klucz API). Użycie dostawcy jest pokazywane dla **bieżącego dostawcy modelu**, gdy jest dostępne, jako znormalizowane okno `X% left` albo tekst podsumowania dostawcy.
- `/usage off|tokens|full` w czatach: stopka użycia dla każdej odpowiedzi.
- `/usage cost` w czatach: lokalne podsumowanie kosztów agregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełny podział według dostawców.
- CLI: `openclaw channels list` wypisuje ten sam snapshot użycia obok konfiguracji dostawcy (użyj `--no-usage`, aby pominąć).
- Pasek menu macOS: sekcja „Użycie” pod Context (tylko jeśli dostępna).

## Domyślny tryb stopki użycia

`/usage off|tokens|full` ustawia stopkę dla sesji i jest zapamiętywany dla tej
sesji. `messages.responseUsage` ustawia początkowo ten tryb dla sesji, które go
jeszcze nie wybrały, więc stopka może być domyślnie włączona bez wpisywania
`/usage` za każdym razem.

Ustaw jeden tryb dla każdego kanału albo mapę dla poszczególnych kanałów z
zapasowym `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Trzy odrębne stany sesji

Pole `responseUsage` sesji ma trzy reprezentowalne stany, każdy o innej
semantyce:

| Stan                    | Przechowywana wartość           | Efektywny tryb                                                        |
| ----------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **Nieustawione / dziedziczenie** | `undefined` (brak)       | Przechodzi do domyślnej konfiguracji `messages.responseUsage`, potem `off`. |
| **Jawnie wyłączone**    | `"off"` (przechowywane)         | Zawsze wyłączone — domyślna konfiguracja inna niż off nie może ponownie włączyć stopki. |
| **Jawnie włączone**     | `"tokens"` albo `"full"` (przechowywane) | Ten tryb, niezależnie od domyślnej konfiguracji.                      |

### Kolejność pierwszeństwa

Efektywny tryb = nadpisanie sesji → wpis konfiguracji kanału → `default` → `off`.

Jawne `/usage off` jest **utrwalane** jako dosłowna wartość `"off"` w sesji, a
nie jako „nieustawione”. Oznacza to, że domyślne `messages.responseUsage` inne
niż off nie może ponownie włączyć stopki po tym, jak użytkownik jawnie ją
wyłączył.

### Resetowanie a wyłączanie

- `/usage off` — wymusza wyłączenie stopki i utrwala ten wybór. Skonfigurowana
  wartość domyślna inna niż off nie może tego nadpisać.
- `/usage reset` (aliasy: `inherit`, `clear`, `default`) — czyści nadpisanie
  sesji. Sesja następnie **dziedziczy** efektywną wartość domyślną konfiguracji
  (`messages.responseUsage`). Jeśli nie skonfigurowano wartości domyślnej,
  stopka jest wyłączona (bez zmiany względem wcześniej). Użyj tego, aby „wrócić
  do wartości domyślnej” bez jawnego włączania stopki.
- Pełny reset sesji (`/reset` albo `/new`) lub rollover sesji **zachowuje**
  jawną preferencję trybu użycia, aby wybór wyświetlania użytkownika przetrwał
  rollovery sesji. Tylko `/usage reset` (i jego aliasy) faktycznie czyści
  nadpisanie.

### Zachowanie przełącznika

`/usage` bez argumentów przełącza cyklicznie: off → tokens → full → off. Punktem
startowym cyklu jest **efektywny** bieżący tryb (nadpisanie sesji przechodzące
do domyślnej konfiguracji, gdy jest nieustawione), więc cykl jest zawsze spójny
z tym, co użytkownik widzi w stopce.

### Konfiguracja

Bez konfiguracji zachowanie pozostaje wcześniejsze (stopka wyłączona do czasu
`/usage`). Użyj `/usage reset`, aby wyczyścić nadpisanie sesji i ponownie
odziedziczyć skonfigurowaną wartość domyślną.

## Niestandardowa stopka `/usage full`

`/usage full` pokazuje wbudowaną kompaktową stopkę z modelem, reasoning, trybem
szybkim/wolnym, oknem kontekstu i kosztem, gdy te pola są dostępne. Pola tokenów
i pamięci podręcznej pozostają dostępne dla niestandardowych szablonów. Plik
szablonu nie jest wymagany.

`messages.usageTemplate` służy tylko do zaawansowanych niestandardowych układów.
Wartością jest ścieżka do pliku JSON (obsługuje `~`) albo obiekt inline, i gdy
jest poprawna, zastępuje wbudowaną stopkę:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Brakujące albo puste szablony po cichu wracają do wbudowanej stopki.
Nieczytelne albo nieprawidłowe skonfigurowane szablony również wracają do
wbudowanej stopki i emitują ostrzeżenie operatora.

Zacznij niestandardowe szablony od wbudowanego kształtu, a następnie edytuj
części, które chcesz zmienić:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Kształt

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Każda powierzchnia jest uporządkowaną listą **części**; silnik renderuje każdą,
usuwa puste i łączy pozostałe z użyciem `sep`. Powierzchnia bez wpisu używa
`output.default`.

### Ścieżki kontraktu

Część odczytuje wartości z kontraktu dla danego turn przez ścieżkę z kropkami.
Brakujące wartości są puste (więc warunek `when` albo `|fallback` utrzymuje
część w czystej postaci).

| Ścieżka                                                                            | Znaczenie                              |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id kanału (`discord`/`telegram`/itd.) |
| `model.provider` / `model.display_name`                                             | id dostawcy / id modelu                |
| `model.reasoning`                                                                   | effort (od `off` do `xhigh`)           |
| `model.is_fallback` / `model.is_override`                                           | bool: użyto fallbacku / model przypięty |
| `state.fast_mode`                                                                   | bool: szybki vs wolny                  |
| `context.max_tokens` / `context.pct_used`                                           | budżet okna / 0-100 użyte              |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregat turn                           |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | warunki wyświetlania tokenów i procent trafień pamięci podręcznej |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | tylko ostatnie wywołanie modelu        |
| `cost.turn_usd`                                                                     | szacowany koszt turn                   |
| `identity.name` / `identity.emoji`                                                  | nazwa agenta / wybrane emoji           |

(Okna limitów szybkości dostawcy **nie** są w tym kontrakcie.)

### Czasowniki

Przepuść wartość przez czasowniki od lewej do prawej; segment niebędący
czasownikiem jest wartością fallback.

| Czasownik       | Efekt                                 | Przykład                          |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | kompaktowa liczba                     | `272000 -> 272k`                  |
| `fixed:N`       | N miejsc dziesiętnych (domyślnie 2)   | `0.0377`                          |
| `dur`           | sekundy na czas trwania               | `14820 -> 4h07m`                  |
| `pct`           | dołącz `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | z użytego na pozostałe            |
| `alias:TABLE`   | wyszukiwanie w `aliases`, echo jeśli poza listą | `medium -> 🌗`                    |
| `meter:W:SCALE` | pasek glifów o W komórkach dla wartości 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = jeden glif) |

### Formy części

- `{ "text": "📚 {context.max_tokens|num}" }`: literał + interpolacja.
- `{ "when": "<path>", "text": "..." }`: renderuj tylko, jeśli ścieżka jest truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: wartość na glif.
- `{ "each": "limits.windows", "item": "{label}" }`: iteruj po tablicy.

### Przykład

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

renderuje np. `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Dostawcy + dane uwierzytelniające

- **Anthropic (Claude)**: tokeny OAuth w profilach uwierzytelniania.
- **GitHub Copilot**: tokeny OAuth w profilach uwierzytelniania.
- **Gemini CLI**: tokeny OAuth w profilach uwierzytelniania.
  - Użycie JSON wraca awaryjnie do `stats`; `stats.cached` jest normalizowane do
    `cacheRead`.
- **OpenAI Codex**: tokeny OAuth w profilach uwierzytelniania (`accountId` używany, gdy jest obecny).
- **MiniMax**: klucz API albo profil uwierzytelniania MiniMax OAuth. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu
  MiniMax, preferuje zapisany MiniMax OAuth, gdy jest obecny, a w przeciwnym razie
  wraca awaryjnie do `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`.
  Odpytywanie użycia wyprowadza host Coding Plan z `models.providers.minimax-portal.baseUrl`
  albo `models.providers.minimax.baseUrl`, gdy jest skonfigurowany, a w przeciwnym razie używa
  hosta MiniMax CN.
  Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają **pozostały**
  limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczniku mają pierwszeństwo,
  gdy są obecne.
  - Etykiety okna planu kodowania pochodzą z pól godzin/minut dostawcy, gdy
    są obecne, a następnie wracają awaryjnie do zakresu `start_time` / `end_time`.
  - Jeśli punkt końcowy planu kodowania zwraca `model_remains`, OpenClaw preferuje
    wpis modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne
    pola `window_hours` / `window_minutes` są nieobecne, i uwzględnia nazwę modelu
    w etykiecie planu.
- **Xiaomi MiMo**: klucz API przez zmienne środowiskowe/konfigurację/magazyn uwierzytelniania (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez zmienne środowiskowe/konfigurację/magazyn uwierzytelniania.
- **DeepSeek**: klucz API przez zmienne środowiskowe/konfigurację/magazyn uwierzytelniania (`DEEPSEEK_API_KEY`).
  OpenClaw wywołuje punkt końcowy salda DeepSeek i pokazuje saldo zgłoszone przez dostawcę
  jako tekst zamiast okna limitu z procentem pozostałej puli.

Użycie jest ukryte, gdy nie można rozwiązać żadnego użytecznego uwierzytelniania użycia dostawcy. Dostawcy
mogą dostarczać logikę uwierzytelniania użycia specyficzną dla Pluginów; w przeciwnym razie OpenClaw wraca awaryjnie do
pasujących poświadczeń OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych
albo konfiguracji.

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
