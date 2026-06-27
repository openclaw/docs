---
read_when:
    - Podłączasz powierzchnie użycia/limitów dostawcy
    - Musisz wyjaśnić zachowanie śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Powierzchnie śledzenia użycia i wymagania dotyczące poświadczeń
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-06-27T17:30:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Czym to jest

- Pobiera użycie/limity dostawcy bezpośrednio z jego endpointów użycia.
- Bez szacowanych kosztów; tylko okna limitów zgłaszane przez dostawcę albo
  podsumowania stanu konta.
- Czytelne dla człowieka wyjście stanu okna limitu jest normalizowane do `X% left`, nawet
  gdy nadrzędne API zgłasza wykorzystany limit, pozostały limit albo tylko surowe
  liczby. Dostawcy bez resetowalnych okien limitów mogą zamiast tego pokazywać tekst
  podsumowania dostawcy, na przykład saldo.
- `/status` na poziomie sesji oraz `session_status` mogą wrócić do najnowszego
  wpisu użycia z transkryptu, gdy bieżąca migawka sesji jest uboga. Ten
  mechanizm uzupełnia brakujące liczniki tokenów/pamięci podręcznej, może odzyskać etykietę aktywnego modelu
  runtime i preferuje większą sumę zorientowaną na prompt, gdy metadane sesji
  są brakujące albo mniejsze. Istniejące niezerowe wartości bieżące nadal wygrywają.

## Gdzie się pojawia

- `/status` w czatach: bogata w emoji karta stanu z tokenami sesji + szacowanym kosztem (tylko klucz API). Użycie dostawcy pokazuje się dla **dostawcy bieżącego modelu**, gdy jest dostępne, jako znormalizowane okno `X% left` albo tekst podsumowania dostawcy.
- `/usage off|tokens|full` w czatach: stopka użycia dla każdej odpowiedzi (OAuth pokazuje tylko tokeny).
- `/usage cost` w czatach: lokalne podsumowanie kosztów zagregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełne rozbicie według dostawców.
- CLI: `openclaw channels list` wypisuje tę samą migawkę użycia obok konfiguracji dostawcy (użyj `--no-usage`, aby pominąć).
- Pasek menu macOS: sekcja „Użycie” w obszarze Kontekst (tylko jeśli dostępna).

## Domyślny tryb stopki użycia

`/usage off|tokens|full` ustawia stopkę dla sesji i jest zapamiętywane dla tej
sesji. `messages.responseUsage` zasila ten tryb dla sesji, które jeszcze go nie
wybrały, więc stopka może być domyślnie włączona bez wpisywania `/usage` za każdym razem.

Ustaw jeden tryb dla każdego kanału albo mapę dla poszczególnych kanałów z zapasowym `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Trzy odrębne stany sesji

Pole `responseUsage` sesji ma trzy reprezentowalne stany, każdy z inną
semantyką:

| Stan                   | Przechowywana wartość          | Tryb wynikowy                                                            |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| **Nieustawiony / dziedziczony** | `undefined` (brak)            | Przechodzi do domyślnej konfiguracji `messages.responseUsage`, potem `off`. |
| **Jawnie wyłączony**   | `"off"` (zapisane)             | Zawsze wyłączony — domyślna konfiguracja inna niż off nie może ponownie włączyć stopki. |
| **Jawnie włączony**    | `"tokens"` albo `"full"` (zapisane) | Ten tryb, niezależnie od domyślnej konfiguracji.                         |

### Priorytet

Tryb wynikowy = nadpisanie sesji → wpis konfiguracji kanału → `default` → `off`.

Jawne `/usage off` jest **utrwalane** jako dosłowna wartość `"off"` w
sesji, a nie jako to samo co „nieustawione”. Oznacza to, że domyślne `messages.responseUsage`
inne niż off nie może ponownie włączyć stopki, gdy użytkownik jawnie ją wyłączył.

### Resetowanie a wyłączanie

- `/usage off` — wymusza wyłączenie stopki i utrwala ten wybór. Skonfigurowana
  wartość domyślna inna niż off nie może tego nadpisać.
- `/usage reset` (aliasy: `inherit`, `clear`, `default`) — czyści nadpisanie sesji.
  Sesja wtedy **dziedziczy** wynikową wartość domyślną konfiguracji
  (`messages.responseUsage`). Jeśli nie skonfigurowano wartości domyślnej, stopka jest wyłączona
  (bez zmiany względem wcześniejszego stanu). Użyj tego, aby „wrócić do wartości domyślnej” bez jawnego
  włączania stopki.
- Pełny reset sesji (`/reset` albo `/new`) lub rotacja sesji **zachowuje**
  jawną preferencję trybu użycia, więc wybór wyświetlania użytkownika przetrwa
  rotacje sesji. Tylko `/usage reset` (i jego aliasy) faktycznie czyści
  nadpisanie.

### Zachowanie przełącznika

`/usage` bez argumentów przełącza cyklicznie: off → tokens → full → off. Punktem startowym
cyklu jest **wynikowy** bieżący tryb (nadpisanie sesji przechodzące
do domyślnej konfiguracji, gdy jest nieustawione), więc cykl zawsze odpowiada temu, co
użytkownik widzi w stopce.

### Konfiguracja

Bez konfiguracji obowiązuje wcześniejsze zachowanie (stopka wyłączona do czasu `/usage`). Użyj
`/usage reset`, aby wyczyścić nadpisanie sesji i ponownie odziedziczyć skonfigurowaną wartość domyślną.

## Niestandardowa stopka `/usage full`

`/usage full` pokazuje wbudowaną kompaktową stopkę z modelem, rozumowaniem, trybem szybkim/wolnym,
oknem kontekstu, tokenami tury, pamięcią podręczną i kosztem, gdy te pola są dostępne. Nie
jest wymagany plik szablonu.

`messages.usageTemplate` służy tylko do zaawansowanych układów niestandardowych. Wartość to
ścieżka do pliku JSON (obsługuje `~`) albo obiekt inline, i zastępuje wbudowaną
stopkę, gdy jest poprawna:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Brakujące albo puste szablony po cichu wracają do wbudowanej stopki. Nieczytelne
albo nieprawidłowe skonfigurowane szablony również wracają do wbudowanej stopki i emitują
ostrzeżenie operatora.

Zacznij niestandardowe szablony od wbudowanego kształtu, a potem edytuj części, które chcesz
zmienić:

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
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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

Każda powierzchnia jest uporządkowaną listą **fragmentów**; silnik renderuje każdy, odrzuca
puste i łączy pozostałe za pomocą `sep`. Powierzchnia bez wpisu używa
`output.default`.

### Ścieżki kontraktu

Fragment odczytuje wartości z kontraktu danej tury przez ścieżkę z kropkami. Nieobecne wartości są
puste (więc strażnik `when` albo `|fallback` utrzymuje fragment w czystości).

| Ścieżka                                                                            | Znaczenie                              |
| ---------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                          | id kanału (`discord`/`telegram`/itd.)  |
| `model.provider` / `model.display_name`                                            | id dostawcy / id modelu                |
| `model.reasoning`                                                                  | wysiłek (`off` do `xhigh`)             |
| `model.is_fallback` / `model.is_override`                                          | bool: użyto zapasowego / model przypięty |
| `state.fast_mode`                                                                  | bool: szybko kontra wolno              |
| `context.max_tokens` / `context.pct_used`                                          | budżet okna / użyte 0-100              |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                | agregat tury                           |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`   | strażniki wyświetlania tokenów i procent pamięci podręcznej |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | tylko ostatnie wywołanie modelu        |
| `cost.turn_usd`                                                                    | szacowany koszt tury                   |
| `identity.name` / `identity.emoji`                                                 | nazwa agenta / wybrane emoji           |

(Okna limitów szybkości dostawcy **nie** są częścią tego kontraktu.)

### Czasowniki

Przepuszczaj wartość przez czasowniki od lewej do prawej; segment niebędący czasownikiem jest wartością zapasową.

| Czasownik       | Efekt                                  | Przykład                          |
| --------------- | -------------------------------------- | --------------------------------- |
| `num`           | zwarta liczba                          | `272000 -> 272k`                  |
| `fixed:N`       | N miejsc po przecinku (domyślnie 2)    | `0.0377`                          |
| `dur`           | sekundy na czas trwania                | `14820 -> 4h07m`                  |
| `pct`           | dołącz `%`                             | `96 -> 96%`                       |
| `inv`           | `100 - x`                              | dla użytego do pozostałego        |
| `alias:TABLE`   | wyszukanie w `aliases`, echo jeśli nie ma na liście | `medium -> 🌗`                    |
| `meter:W:SCALE` | pasek glifów W-komórkowy dla wartości 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = jeden glif) |

### Formy fragmentów

- `{ "text": "📚 {context.max_tokens|num}" }`: literał + interpolacja.
- `{ "when": "<path>", "text": "..." }`: renderuj tylko, jeśli ścieżka jest prawdziwa.
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
- **OpenAI Codex**: tokeny OAuth w profilach uwierzytelniania (`accountId` używane, gdy jest obecne).
- **MiniMax**: klucz API albo profil uwierzytelniania OAuth MiniMax. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako ten sam obszar limitu MiniMax,
  preferuje zapisane OAuth MiniMax, gdy jest obecne, a w przeciwnym razie wraca
  awaryjnie do `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` lub `MINIMAX_API_KEY`.
  Odpytywanie użycia wyprowadza host Coding Plan z `models.providers.minimax-portal.baseUrl`
  albo `models.providers.minimax.baseUrl`, gdy jest skonfigurowany, a w przeciwnym razie używa
  hosta MiniMax CN.
  Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają **pozostały**
  limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, gdy
  są obecne.
  - Etykiety okna coding-plan pochodzą z pól godzin/minut dostawcy, gdy
    są obecne, a następnie wracają awaryjnie do zakresu `start_time` / `end_time`.
  - Jeśli punkt końcowy coding-plan zwraca `model_remains`, OpenClaw preferuje
    wpis modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne
    pola `window_hours` / `window_minutes` są nieobecne, i uwzględnia nazwę modelu
    w etykiecie planu.
- **Xiaomi MiMo**: klucz API przez zmienną środowiskową/konfigurację/magazyn uwierzytelniania (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez zmienną środowiskową/konfigurację/magazyn uwierzytelniania.
- **DeepSeek**: klucz API przez zmienną środowiskową/konfigurację/magazyn uwierzytelniania (`DEEPSEEK_API_KEY`).
  OpenClaw wywołuje punkt końcowy salda DeepSeek i pokazuje zgłoszone przez dostawcę
  saldo jako tekst zamiast okna procentowego pozostałego limitu.

Użycie jest ukryte, gdy nie można ustalić żadnego nadającego się do użycia uwierzytelniania użycia dostawcy. Dostawcy
mogą dostarczać logikę uwierzytelniania użycia specyficzną dla Plugin; w przeciwnym razie OpenClaw wraca awaryjnie do
pasujących poświadczeń OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych
lub konfiguracji.

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
